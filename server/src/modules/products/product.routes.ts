import { FastifyPluginAsync } from 'fastify';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  listProductsQuerySchema,
  createProductSwaggerSchema,
  listProductsSwaggerSchema,
  getLowStockProductsSwaggerSchema,
  getProductSwaggerSchema,
  updateProductSwaggerSchema,
  deleteProductSwaggerSchema,
} from './product.schemas';
import * as productService from './product.service';

export const productRoutes: FastifyPluginAsync = async (app) => {
  // POST / — Cadastrar novo produto
  app.post('/', {
    schema: createProductSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const data = createProductSchema.parse(request.body);
    const product = await productService.createProduct(
      app.prisma,
      data,
      request.user.name || request.user.email
    );
    return reply.status(201).send(product);
  });

  // GET / — Listar produtos (paginado, busca textual)
  app.get('/', {
    schema: listProductsSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const query = listProductsQuerySchema.parse(request.query);
    const result = await productService.listProducts(app.prisma, query);
    return reply.status(200).send(result);
  });

  // GET /low-stock — Consultar produtos com estoque baixo ou crítico
  // IMPORTANTE: Deve vir antes de /:id para evitar colisões no roteador
  app.get('/low-stock', {
    schema: getLowStockProductsSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (_request, reply) => {
    const products = await productService.getLowStockProducts(app.prisma);
    return reply.status(200).send(products);
  });

  // GET /:id — Buscar produto por UUID
  app.get('/:id', {
    schema: getProductSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = productIdParamSchema.parse(request.params);
    const product = await productService.getProductById(app.prisma, id);
    return reply.status(200).send(product);
  });

  // PUT /:id — Atualizar dados cadastrais do produto
  app.put('/:id', {
    schema: updateProductSwaggerSchema,
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = productIdParamSchema.parse(request.params);
    const data = updateProductSchema.parse(request.body);
    const product = await productService.updateProduct(app.prisma, id, data);
    return reply.status(200).send(product);
  });

  // DELETE /:id — Excluir produto (ADMIN apenas)
  app.delete('/:id', {
    schema: deleteProductSwaggerSchema,
    preHandler: [app.authenticate, app.requireRole(['ADMIN'])],
  }, async (request, reply) => {
    const { id } = productIdParamSchema.parse(request.params);
    await productService.deleteProduct(app.prisma, id);
    return reply.status(204).send();
  });
};
