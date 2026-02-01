import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable global exception filter for error sanitization
  app.useGlobalFilters(new GlobalExceptionFilter());
  
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
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:3077'];
  
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  
  const port = process.env.PORT || 3088;
  await app.listen(port);
  console.log(`🚀 BotRights.ai API running on http://localhost:${port}`);
}
bootstrap();
// Cache bust: 1769901814
