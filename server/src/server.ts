import { buildApp } from './app';
import { env } from './config/env';

async function bootstrap() {
  const app = await buildApp();

  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST
    });

    app.log.info(`🚀 Servidor Fastify ativo e ouvindo em ${address}`);
    app.log.info(`📄 Documentação Swagger disponível em ${address}/docs`);
    app.log.info(`🩺 Healthcheck disponível em ${address}/health`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful Shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.warn(`Recebido sinal ${signal}, encerrando aplicação de forma graciosa...`);
      await app.close();
      process.exit(0);
    });
  }
}

bootstrap();
