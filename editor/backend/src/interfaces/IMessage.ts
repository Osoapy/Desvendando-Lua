export interface IChatMessage {}

export interface IUserMessage extends IChatMessage {}
export interface IBotMessage extends IChatMessage {}

export interface IMessageStruct {
  name: string,
  data: any
}
