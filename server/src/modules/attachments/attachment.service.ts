import { PrismaClient } from '@prisma/client';
import { MultipartFile } from '@fastify/multipart';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { attachmentTypeEnum, AttachmentType } from './attachment.schemas';
import { AuthUserPayload } from '../../plugins/auth';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export function getUploadsDir(): string {
  const dir = path.resolve(process.cwd(), 'uploads/work-orders');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function uploadAttachment(
  prisma: PrismaClient,
  workOrderId: string,
  filePart: MultipartFile,
  user: AuthUserPayload
) {
  // 1. Validar existência da Ordem de Serviço
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
  });

  if (!workOrder) {
    throw createHttpError(404, 'Ordem de serviço não encontrada.');
  }

  // 2. Validar MIME type
  if (!ALLOWED_MIME_TYPES.includes(filePart.mimetype)) {
    throw createHttpError(
      400,
      `Tipo de arquivo não permitido: ${filePart.mimetype}. Tipos permitidos: ${ALLOWED_MIME_TYPES.join(', ')}.`
    );
  }

  // 3. Validar e sanitizar categoria do anexo (type)
  let rawType: string = 'DOCUMENT';
  if (filePart.fields && (filePart.fields as any).type) {
    const fieldVal = (filePart.fields as any).type;
    rawType = typeof fieldVal.value === 'string' ? fieldVal.value : (typeof fieldVal === 'string' ? fieldVal : 'DOCUMENT');
  }

  const parsedType = attachmentTypeEnum.safeParse(rawType);
  if (!parsedType.success) {
    throw createHttpError(
      400,
      `Categoria de anexo inválida: ${rawType}. Valores permitidos: BEFORE, AFTER, DOCUMENT.`
    );
  }

  // 4. Ler buffer do arquivo e validar tamanho
  const buffer = await filePart.toBuffer();
  if (buffer.length === 0) {
    throw createHttpError(400, 'Arquivo enviado está vazio.');
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw createHttpError(400, 'Tamanho do arquivo excede o limite máximo permitido de 10MB.');
  }

  // 5. Gerar nome de arquivo seguro via UUID (prevenção contra Path Traversal)
  const ext = path.extname(filePart.filename || '').toLowerCase() || (filePart.mimetype === 'application/pdf' ? '.pdf' : '.jpg');
  const fileName = `${randomUUID()}${ext}`;
  const uploadsDir = getUploadsDir();
  const filePath = path.resolve(uploadsDir, fileName);

  // 6. Gravar arquivo físico no disco
  await fs.promises.writeFile(filePath, buffer);

  // 7. Persistir metadados no banco via Prisma
  try {
    const attachment = await prisma.workOrderAttachment.create({
      data: {
        workOrderId,
        fileName,
        originalName: filePart.filename || fileName,
        mimeType: filePart.mimetype,
        size: buffer.length,
        url: `/uploads/work-orders/${fileName}`,
        type: parsedType.data,
        uploadedBy: user.name || user.email || 'SYSTEM',
      },
    });

    return attachment;
  } catch (err) {
    // Em caso de falha no banco de dados, remove o arquivo gravado para evitar arquivos órfãos
    await fs.promises.unlink(filePath).catch(() => {});
    throw err;
  }
}

export async function listAttachments(
  prisma: PrismaClient,
  workOrderId: string,
  typeFilter?: AttachmentType
) {
  // 1. Validar existência da Ordem de Serviço
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
  });

  if (!workOrder) {
    throw createHttpError(404, 'Ordem de serviço não encontrada.');
  }

  // 2. Buscar anexos ordenados decrescentemente pela data de criação
  return await prisma.workOrderAttachment.findMany({
    where: {
      workOrderId,
      ...(typeFilter ? { type: typeFilter } : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function deleteAttachment(
  prisma: PrismaClient,
  workOrderId: string,
  attachmentId: string,
  user: AuthUserPayload
) {
  // 1. Validar existência da Ordem de Serviço
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
  });

  if (!workOrder) {
    throw createHttpError(404, 'Ordem de serviço não encontrada.');
  }

  // 2. Buscar anexo associado à OS
  const attachment = await prisma.workOrderAttachment.findFirst({
    where: {
      id: attachmentId,
      workOrderId,
    },
  });

  if (!attachment) {
    throw createHttpError(404, 'Anexo não encontrado.');
  }

  // 3. Checagem de permissão RBAC: apenas ADMIN ou o próprio autor pode excluir
  const isAdmin = user.role === 'ADMIN';
  const isAuthor = attachment.uploadedBy === user.name || attachment.uploadedBy === user.email;

  if (!isAdmin && !isAuthor) {
    throw createHttpError(
      403,
      'Acesso negado: apenas administradores ou o autor do envio podem excluir este anexo.'
    );
  }

  // 4. Remover registro no banco de dados
  await prisma.workOrderAttachment.delete({
    where: { id: attachmentId },
  });

  // 5. Excluir arquivo físico do disco
  const uploadsDir = getUploadsDir();
  const filePath = path.resolve(uploadsDir, attachment.fileName);
  await fs.promises.unlink(filePath).catch(() => {});

  return { message: 'Anexo excluído com sucesso.' };
}
