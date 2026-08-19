export interface IServiceHandler
{
    next(handler : IServiceHandler | undefined) : IServiceHandler | undefined;
}