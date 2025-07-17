import { IsNumber, IsPositive, Min } from 'class-validator';

export class ChargeBalanceDto {
  @IsNumber()
  @IsPositive()
  userId: number;

  @IsNumber()
  @Min(1)
  amount: number;
}

export class GetBalanceDto {
  @IsNumber()
  @IsPositive()
  userId: number;
}
