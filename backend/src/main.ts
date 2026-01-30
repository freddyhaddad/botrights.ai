import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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
