
import { NextResponse } from 'next/server';

export function GET() {
  const userVar = process.env.EMAIL_USER;
  const passVarExists = !!process.env.EMAIL_PASS; // Проверяваме само дали съществува, не връщаме стойността от съображения за сигурност
  const testVar = process.env.TEST_VAR;

  const response = {
    'Прочетена стойност за EMAIL_USER': userVar || 'НЕ Е НАМЕРЕНА',
    'Променливата EMAIL_PASS съществува ли?': passVarExists,
    'Прочетена стойност за TEST_VAR': testVar || 'НЕ Е НАМЕРЕНА',
  };

  return NextResponse.json(response);
}
