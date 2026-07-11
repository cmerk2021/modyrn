import { Inject } from '@nestjs/common';

/** Injects the Drizzle {@link Database} instance. */
export const InjectDatabase = (): ParameterDecorator => Inject('DB');
