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

// XXX!!!
export class RateablePost implements ReadablePost {
  likes: number;
  dislikes: number;
  rated: Rating;

  constructor(
    readonly id: number,
    readonly content: Message,
    likes: number,
    dislikes: number,
    rated: Rating,
    readonly location: SpatialPoint,
  ) {
    this.id = id;
    this.content = content;
    this.likes = likes;
    this.dislikes = dislikes;
    this.rated = rated;
    this.location = { ...location };
  }

  rate(newRating: Rating.LIKE | Rating.DISLIKE): void {
    if (this.rated === newRating) {
      this.rated = Rating.UNSET;
      if (newRating === Rating.LIKE) this.likes--; else this.dislikes--;

      return;
    }

    if (newRating === Rating.LIKE) {
      this.likes += 1;
      if (this.rated === Rating.DISLIKE) this.dislikes -= 1;
    } else {
      this.dislikes += 1;
      if (this.rated === Rating.LIKE) this.likes -= 1;
    }

    this.rated = newRating;
  }
}
