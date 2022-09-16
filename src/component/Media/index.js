import { app } from '../../';
import { config } from '../../config';

export const Media = function() {

  this.mediaSupport = {
    image: ['png', 'jpg', 'jpeg', 'svg', 'gif', 'gifv'],
    video: ['mp4'],
  }

  this.redditFetch = ({ subreddit, sort, time, allowModPost, allowCrossPost, allowVideo }) => {

    return new Promise((resolve, reject) => {

      if (!subreddit) { subreddit = this.lastOptions.subreddit || 'all' };

      if (!sort) { sort = this.lastOptions.sort || 'best' };

      if (!time) { time = this.lastOptions.time || 'day' };

      if (!allowModPost) { allowModPost = this.lastOptions.allowModPost || false };

      if (!allowCrossPost) { allowCrossPost = this.lastOptions.allowCrossPost || false };

      if (!allowVideo) { allowVideo = this.lastOptions.allowVideo || false };

      this.lastOptions = { subreddit, sort, time, allowModPost, allowCrossPost, allowVideo };

      sort = sort.toLowerCase();

      subreddit = subreddit.toLowerCase();

      const getLastId = () => {

        if (this.lastId) { return `&after=${this.lastId}`; } else { return ''; }

      }

      const url = `https://api.reddit.com/r/${subreddit}/${sort}/.json?t=${time}${getLastId()}`;

      fetch(url).then(result => result.json())
        .then(body => {

          if (!body.data.children.length) {
            console.log(`[Media] Unable to find a post. The subreddit '${subreddit}' does not exist, or it has no available post data.`);
          }

          if (!allowModPost) {
            body.data.children = body.data.children.filter(p => !p.data.distinguished);
          }

          if (!allowCrossPost) {
            body.data.children = body.data.children.filter(p => !p.data.crosspost_parent_list);
          }

          if (!allowVideo) {
            body.data.children = body.data.children.filter(p => !p.is_video);
          }

          if (!body.data.children.length) {
            console.log('[Media] Unable to find a post that meets specified criteria. There may be an error in the options passed in.');
          }

          resolve(body);

          console.log('[Media]', 'fetch', url, { subreddit, sort, time, after: getLastId() });

        });
    });
  }

  this.lastOptions = false;

  this.lastId = false;

  this.url = false;

  this.fetching = false;

  this.import = (subreddit, sort, time) => {

    if (!this.fetching) {

      this.fetching = true;

      this.redditFetch({ subreddit: subreddit, sort: sort, time: time, allowVideo: config.media.video }).then(fetchData => {

        this.lastId = fetchData.data.after;

        let arrayOfMedia = [];

        fetchData.data.children.forEach(postItem => {

          let urlPart = postItem.data.url.split(/\.(?=[^\.]+$)/);

          if (this.mediaSupport.image.includes(urlPart[1])) {

            if (urlPart[1] == 'gifv') { postItem.data.url = postItem.data.url.replace('gifv', 'mp4') };

            arrayOfMedia.push({ url: postItem.data.url, subreddit: postItem.data.subreddit });

          }

        });

        app.grid.render(arrayOfMedia);

        this.fetching = false;

        console.log('[Media]', 'import', fetchData);

      });

    };

  }

  this.import(config.subreddit.list.join('+'), config.subreddit.sort, config.subreddit.time);

}
