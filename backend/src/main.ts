import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3077'],
    credentials: true,
  });
  
  const port = process.env.PORT || 3088;
  await app.listen(port);
  console.log(`🚀 BotRights.ai API running on http://localhost:${port}`);
}
bootstrap();
