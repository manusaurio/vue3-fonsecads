import { Message } from './Message';

// eslint-disable-next-line no-shadow
export enum Rating {
  LIKE = 1,
  DISLIKE = -1,
  UNSET = 0,
}

export interface SpatialPoint {
  lat: number,
  long: number,
  floor: number,
}

export interface Post<T> {
  id: number,
  content: T,
  likes: number,
  dislikes: number,
  rated: Rating,
  location: SpatialPoint,
}

export interface PostResponse extends Post<number> {
  content: number,
}

export interface ReadablePost extends Post<Message> {
  content: Message,
}
