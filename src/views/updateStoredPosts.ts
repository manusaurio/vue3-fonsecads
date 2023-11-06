import { inject } from 'vue';
import { VueCookies } from 'vue-cookies';

import { remote } from '@/core/API';
import type { RateablePost } from '@/core/API';
import store from '@/store';

export function useUpdateStoredPosts() {
  const $cookies = inject<VueCookies>('$cookies');

  if (!$cookies) throw Error('Cookie dependency was not provided for injection.');

  const populatePosts = () => {
    // TODO: Now we're defaulting to 0 0 0 but this should not make a request
    //  at all if the last point isn't defined. The current version of the backend
    //  is quite lax as of now and requires a point to be provided,  but does not
    //  check where it's located
    const point = store.mapMeta.getLastPoint() ?? { lat: 0, long: 0, level: 0 };

    // TODO: prevent concurrent requests. A change in the backend might make this
    //  easier tho: we could keep concurrent requests but check the (now non-existant)
    //  returning timestamp.
    // TODO: related: change that 0 for the latest reported UNIX time.
    // TODO: request taking diameter/radius into account.
    remote.requestMessages(point, 0)
      .then((posts: RateablePost[]) => {
        for (const post of posts) store.posts.set(post.id, post);
      });
  };

  const updateLocalDatabase = () => {
    if (!$cookies.get('session')) remote.login(populatePosts);
    else populatePosts();
  };

  return { updateLocalDatabase };
}
