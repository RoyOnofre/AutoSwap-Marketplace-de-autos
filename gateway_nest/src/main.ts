import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with proper configuration for development
  app.enableCors({
    origin: ['http://localhost:3003', 'http://localhost:3000', 'http://127.0.0.1:3003'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  const globalPrefix = process.env.GATEWAY_PREFIX || 'v1';
  app.setGlobalPrefix(globalPrefix);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger (OpenAPI 3.1) documentation
  const config = new DocumentBuilder()
    .setTitle('AutoSwap API')
    .setDescription('Gateway API for AutoSwap marketplace')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Swagger UI será accesible en /v1/docs
  SwaggerModule.setup('docs', app, document);

  const port = process.env.GATEWAY_PORT ? Number(process.env.GATEWAY_PORT) : 3001;
  await app.listen(port);
  console.log(`Gateway listening on http://localhost:${port}/${globalPrefix}`);
}
bootstrap();
