import { Module } from '@nestjs/common';
import { FoodResolver } from './food.resolver';
import { FoodService } from './food.service';

@Module({
  providers: [FoodResolver, FoodService],
})
export class FoodModule {}
