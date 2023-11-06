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
  level: number,
}

export interface Post<T> {
  id: number,
  location: SpatialPoint,
  content?: T,
  likes?: number,
  dislikes?: number,
  rated?: Rating,
  creationTime?: number,
  bySelf?: boolean,
}

export interface PostResponse extends Post<number> {
  content: number,
  creationTime: number,
}

export interface ReadablePost extends Post<Message> {
  content: Message,
}

// XXX!!!
export class RateablePost implements ReadablePost {
  likes: number;
  dislikes: number;
  rated: Rating;
  readonly location: { lat: number, long: number, level: number };

  constructor(
    readonly id: number,
    readonly content: Message,
    likes: number,
    dislikes: number,
    rated: Rating,
    location: SpatialPoint,
    readonly creationTime: number,
  ) {
    this.id = id;
    this.content = content;
    this.likes = likes;
    this.dislikes = dislikes;
    this.rated = rated;
    this.location = {
      lat: location.lat,
      long: location.long,
      level: location.level,
    };
    this.creationTime = creationTime;
  }

  rateLocally(newRating: Rating.LIKE | Rating.DISLIKE): Rating {
    if (this.rated === newRating) {
      this.rated = Rating.UNSET;
      if (newRating === Rating.LIKE) this.likes--; else this.dislikes--;

      return this.rated;
    }

    if (newRating === Rating.LIKE) {
      this.likes += 1;
      if (this.rated === Rating.DISLIKE) this.dislikes -= 1;
    } else {
      this.dislikes += 1;
      if (this.rated === Rating.LIKE) this.likes -= 1;
    }

    this.rated = newRating;
    return this.rated;
  }
}

// eslint-disable-next-line arrow-body-style
const responseToRateable = (pr: PostResponse): RateablePost => {
  return new RateablePost(
    pr.id,
    Message.fromString(`${pr.content}`),
    pr.likes ?? 0,
    pr.dislikes ?? 0,
    pr.rated ?? Rating.UNSET,
    pr.location,
    pr.creationTime,
  );
};

const backendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://susurr.ar/api';

// TODO: Complete and refactor this disaster
export const remote = {
  async login(onSuccess?: () => void) {
    fetch(
      `${backendUrl}/login`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'fetch',
        },
      },
    )
      .then((r: Response) => {
        if (r.status === 201) return r.json();
        throw new Error(`Login response was not 201: ${r.status} ${r.statusText}`);
      })
      .then(onSuccess);
  },
  requestMessage(id: number) {
    const req = fetch(
      `${backendUrl}/messages?ids=${id}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'fetch',
        },
      },
    );

    const jsonPost = req.then((r: Response) => r.json());
    jsonPost.then(responseToRateable);

    return jsonPost;
  },
  requestMessages(location: SpatialPoint, since?: number, ids?: Array<number>) {
    const queryParams = new URLSearchParams();
    queryParams.set('location', `${location.long} ${location.lat} ${location.level ?? 0}`);
    if (since !== undefined) queryParams.set('since', since.toString());
    if (ids) queryParams.set('ids', ids.join('.'));

    const req = fetch(
      `${backendUrl}/messages?${queryParams}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'fetch',
        },
      },
    );

    return req.then((r: Response) => r.json())
      .then((r: Array<PostResponse>) => r.map(responseToRateable));
  },
  setRating(id: number, rating: Rating) {
    const req = fetch(
      `${backendUrl}/messages/vote`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'fetch',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          id: id.toString(),
          vote: rating.toString(),
        }),
      },
    );
    return req;
  },
  postMessage(location: SpatialPoint, content: Message) {
    const req = fetch(
      `${backendUrl}/messages`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'fetch',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          location: `${location.lat} ${location.long} ${location.level}`,
          content: content.toBigInt().toString(),
        }).toString(),
      },
    );
    return req.then((p: Response) => p.json())
      .then(responseToRateable);
  },
};
