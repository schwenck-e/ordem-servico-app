import fp from 'fastify-plugin';
import multipart from '@fastify/multipart';

export default fp(async (app) => {
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB máximo por arquivo
      files: 1,                   // 1 arquivo por requisição
      fields: 5,                  // Campos textuais (ex.: type)
    },
    attachFieldsToBody: false
  });
});
