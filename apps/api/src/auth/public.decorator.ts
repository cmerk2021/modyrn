import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'modyrn:isPublic';

/** Marks a route as publicly accessible, bypassing the global auth guard. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
