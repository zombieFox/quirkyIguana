import { app } from '../../';
import { config } from '../../config';

export const Media = function() {

  this.lastOptions = false;

  this.lastId = false;

  this.url = false;

  this.fetching = false;

  this.redditFetch = ({ subreddit, limit, sort, time, allowModPost, allowCrossPost, allowVideo }) => {

    return new Promise((resolve, reject) => {

      sort = sort.toLowerCase();

      subreddit = subreddit.toLowerCase();

      const getLastId = () => {

        if (this.lastId) { return `&after=${this.lastId}`; } else { return ''; }

      }

      const url = `https://api.reddit.com/r/${subreddit}/${sort}/.json?limit=${limit}&t=${time}${getLastId()}`;

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

  this.import = ({ subreddit, limit, sort, time, allowVideo, allowModPost, allowCrossPost, func }) => {

    if (!this.fetching) {

      this.fetching = true;

      if (!subreddit) { subreddit = this.lastOptions.subreddit || 'all' };

      if (!limit) { limit = this.lastOptions.limit || 10 };

      if (!sort) { sort = this.lastOptions.sort || 'best' };

      if (!time) { time = this.lastOptions.time || 'day' };

      if (!allowModPost) { allowModPost = this.lastOptions.allowModPost || false };

      if (!allowCrossPost) { allowCrossPost = this.lastOptions.allowCrossPost || false };

      if (!allowVideo) { allowVideo = this.lastOptions.allowVideo || false };

      this.lastOptions = { subreddit, limit, sort, time, allowModPost, allowCrossPost, allowVideo };

      this.redditFetch({ subreddit, limit, sort, time, allowVideo, allowModPost, allowCrossPost })
        .then(fetchData => {

          this.lastId = fetchData.data.after;

          let arrayOfMedia = [];

          fetchData.data.children.forEach(postItem => {

            let type = null;

            let url = null;

            if (postItem.data.post_hint === 'image') {

              type = 'image';

              url = postItem.data.url;

            } else if (

              String(postItem.data.url).endsWith('.gif') ||

              String(postItem.data.url).endsWith('.jpg') ||

              String(postItem.data.url).endsWith('.jpeg') ||

              String(postItem.data.url).endsWith('.png')

            ) {

              type = 'image';

              url = postItem.data.url;

            } else if (

              postItem.data.secure_media &&

              postItem.data.secure_media.reddit_video &&

              postItem.data.secure_media.reddit_video.fallback_url

            ) {

              type = 'video';

              url = postItem.data.secure_media.reddit_video.fallback_url;

            } else if (postItem.data.post_hint === 'hosted:video') {

              type = 'video';

              url = postItem.data.url;

            } else if (

              postItem.data.preview &&

              postItem.data.preview.reddit_video_preview &&

              postItem.data.preview.reddit_video_preview.fallback_url

            ) {

              type = 'video';

              url = postItem.data.preview.reddit_video_preview.fallback_url;

            } else if (postItem.data.is_gallery) {

              if (postItem.data.media_metadata && postItem.data.gallery_data.items) {

                switch (postItem.data.media_metadata[postItem.data.gallery_data.items[0].media_id].e) {

                  case 'Image':

                    type = 'image';

                    url = postItem.data.media_metadata[postItem.data.gallery_data.items[0].media_id].s.u.replace(/amp;/g, '');

                    break;

                  case 'AnimatedImage':

                    type = 'video';

                    url = postItem.data.media_metadata[postItem.data.gallery_data.items[0].media_id].s.mp4.replace(/amp;/g, '');

                    break;

                }

              }

            }

            if (url) {

              arrayOfMedia.push({
                type,
                url,
                score: postItem.data.score,
                comment: postItem.data.num_comments,
                title: postItem.data.title,
                page: `https://www.reddit.com${postItem.data.permalink}`,
                subreddit: `https://www.reddit.com/${postItem.data.subreddit_name_prefixed}`,
                subredditName: postItem.data.subreddit_name_prefixed,
              });

            }

          });

          app.grid.render(arrayOfMedia);

          this.fetching = false;

          if (func) { func(); }

          console.log('[Media]', 'import', fetchData);

        });

    };

  }

  this.import({
    subreddit: config.subreddit.list.join('+'),
    limit: 20,
    sort: config.subreddit.sort,
    time: config.subreddit.time,
    allowVideo: config.media.video,
    allowModPost: true,
    allowCrossPost: true,
    func: false,
  });

}
