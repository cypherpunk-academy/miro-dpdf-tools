export type HookMutationResult<
    Invoke extends (...args: any[]) => any,
    Return,
    Info
> = [Invoke: Invoke, Return: Return, Info: Info];
