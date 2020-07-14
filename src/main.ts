import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
  });

  const swaggerUIOptions = new DocumentBuilder()
    .setTitle('Twitter Topic Scraper')
    .setDescription('')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerUIOptions);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(3000);
}
bootstrap();
