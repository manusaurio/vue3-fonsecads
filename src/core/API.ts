import { Message } from './Message';

export interface Post<T> {
  id: number,
  content: T,
  likes: number,
  dislikes: number,
  liked: boolean,
  location: {
    lat: number,
    long: number,
    floor: number,
  }
}

export interface PostResponse extends Post<number>{
    content: number,
}

export interface ReadablePost extends Post<Message>{
    content: Message,
}
