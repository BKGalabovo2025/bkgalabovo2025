
import { z } from 'zod';

/**
 * Zod схема за валидация на данните за член на клуба.
 * Тази схема гарантира, че данните, идващи от Firestore, 
 * отговарят на очакваната структура, преди да бъдат използвани в приложението.
 */
export const MemberSchema = z.object({
    // Основни полета, които трябва да съществуват
    id: z.string().min(1, "ID е задължително поле."),
    firstName: z.string().min(1, "Първото име е задължително."),
    lastName: z.string().min(1, "Фамилията е задължителна."),
    registrationDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Невалиден формат на дата за регистрация" }),
    status: z.enum(['active', 'inactive', 'suspended']),

    // Напълно незадължителни (nullable) полета
    middleName: z.string().nullable().optional(),
    email: z.string().email("Невалиден имейл адрес").nullable().optional(),
    phone: z.string().nullable().optional(),
    phoneType: z.enum(['personal', 'parent']).nullable().optional(),
    dateOfBirth: z.string().refine(val => val === null || !isNaN(Date.parse(val)), { message: "Невалиден формат на рождена дата" }).nullable().optional(),
    avatarUrl: z.string().url("Невалиден URL на аватар").nullable().optional(),
    familyId: z.string().nullable().optional(),
    educationInstitution: z.string().nullable().optional(),
    personalId: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    analysisCache: z.unknown().nullable().optional(),
    suspended: z.boolean().optional(),

    // Производно поле, което не е в базата данни, но се добавя в кода
    name: z.string(), // Името вече е задължително
});

/**
 * TypeScript тип, изведен от Zod схемата.
 * Този тип се използва в цялото приложение за гарантиране на типовата безопасност.
 */
export type Member = z.infer<typeof MemberSchema>;
