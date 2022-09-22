import { Image } from '../Image';
import { Video } from '../Video';
import { Zoomer } from '../Zoomer';
import { Icon } from '../Icon';

import { app } from '../../';
import { config } from '../../config';
import { node } from '../../utility/node';
import { complexNode } from '../../utility/complexNode';
import { applyCSSVar } from '../../utility/applyCSSVar';
import { removeCSSVar } from '../../utility/removeCSSVar';

import './index.css';

export const GridItem = function(mediaData) {

  this.node = {
    gridItem: node('div|class:GridItem'),
    detail: node('div|class:GridItem__detail'),
    subreddit: complexNode({
      tag: 'a',
      text: mediaData.subredditName,
      attr: [{ key: 'class', value: 'GridItem__subreddit' }, { key: 'href', value: mediaData.subreddit }, { key: 'target', value: '_blank' }]
    }),
    page: complexNode({
      tag: 'a',
      attr: [{ key: 'class', value: 'GridItem__page' }, { key: 'href', value: mediaData.page }, { key: 'target', value: '_blank' }],
      node: [new Icon('link').getNode()]
    }),
    mediaItem: null,
  }

  this.orientation = (mediaOrientation) => {

    switch (mediaOrientation) {

      case 'square':
        this.node.gridItem.classList.add('GridItem__square');
        break;

      case 'landscape':
        this.node.gridItem.classList.add('GridItem__landscape');
        break;

      case 'portrait':
        this.node.gridItem.classList.add('GridItem__portrait');
        break;

    }

  }

  this.type = null;

  this.pan = {}

  this.pan.reset = () => {

    applyCSSVar('--GridItem__panX', 0, this.node.gridItem);

    applyCSSVar('--GridItem__panY', 0, this.node.gridItem);

  }

  this.pan.move = (event) => {

    let gridItemWidth = this.node.gridItem.clientWidth;

    let gridItemHeight = this.node.gridItem.clientHeight;

    let mediaItemWidth = this.node.mediaItem.node.content.clientWidth;

    let mediaItemHeight = this.node.mediaItem.node.content.clientHeight;

    let overflowX = (mediaItemWidth - gridItemWidth) / 2;

    let overflowY = (mediaItemHeight - gridItemHeight) / 2;

    let cursorPostionX = event.clientX - this.node.gridItem.offsetLeft;

    let cursorPostionY = (event.clientY + window.scrollY) - this.node.gridItem.offsetTop;

    let xCenterOffset = (gridItemWidth / 2) - cursorPostionX;

    let yCenterOffset = (gridItemHeight / 2) - cursorPostionY;

    applyCSSVar('--GridItem__panX', (overflowX / (gridItemWidth / 2)) * xCenterOffset, this.node.gridItem);

    applyCSSVar('--GridItem__panY', (overflowY / (gridItemHeight / 2)) * yCenterOffset, this.node.gridItem);

  }

  this.max = () => {

    let windowWidth = window.innerWidth;

    let windowHeight = window.innerHeight;

    this.node.gridItem.classList.remove('GridItem__maxHeight');

    this.node.gridItem.classList.remove('GridItem__maxWidth');

    if (
      (windowWidth / mediaData.gridItem.node.mediaItem.naturalWidth) <
      (windowHeight / mediaData.gridItem.node.mediaItem.naturalHeight)
    ) {

      this.node.gridItem.classList.add('GridItem__maxWidth');

    } else {

      this.node.gridItem.classList.add('GridItem__maxHeight');

    }

  }

  this.size = () => {

    applyCSSVar('--GridItem__mediaWidth', this.node.mediaItem.naturalWidth, this.node.gridItem);

    applyCSSVar('--GridItem__mediaHeight', this.node.mediaItem.naturalHeight, this.node.gridItem);

  }

  this.loadError = () => {

    this.node.gridItem.remove();

  }

  this.detail = {}

  this.detail.reset = () => {

    this.node.gridItem.classList.remove('GridItem__showDetail');

  }

  this.detail.check = () => {

    let rect = this.node.gridItem.getBoundingClientRect();

    let cursorPostionX = event.clientX - this.node.gridItem.offsetLeft;

    let cursorPostionY;

    switch (app.grid.view.getActive().id) {

      case 'solo':

        cursorPostionY = (event.clientY + window.scrollY) - app.grid.getNode().offsetTop;

        break;

      default:

        cursorPostionY = (event.clientY + window.scrollY) - this.node.gridItem.offsetTop;

        break;

    }

    let threshold = rect.height * 0.25;

    if (cursorPostionY < threshold) {

      this.node.gridItem.classList.add('GridItem__showDetail');

    } else {

      this.node.gridItem.classList.remove('GridItem__showDetail');

    };

  }

  this.bind = () => {

    this.node.gridItem.addEventListener('mousemove', event => {

      this.detail.check(event);

    });

    this.node.gridItem.addEventListener('mouseout', event => {

      this.detail.reset();

    });

    this.node.gridItem.addEventListener('mousemove', event => {

      if (event.shiftKey && config.grid.view.square.active) { this.pan.move(event); };

    });

    this.node.gridItem.addEventListener('click', event => {

      if (!event.altKey && !event.shiftKey && !event.path.includes(this.node.detail)) {

        switch (app.grid.view.getActive().id) {

          case 'square':
          case 'grid':
          case 'flex':
          case 'column':

            app.grid.view.last.id = app.grid.view.getActive().id;

            app.grid.view.last.scrollY = document.documentElement.scrollTop;

            app.grid.view.change('solo');

            app.grid.style();

            this.node.gridItem.scrollIntoView();

            this.size();

            this.max();

            app.message.render(app.grid.view.option[4].id.toUpperCase());

            break;

          case 'solo':

            let scrollPosition = document.documentElement.scrollTop;

            if (app.grid.view.last.id === null || app.grid.view.last.id == 'solo') {
              app.grid.view.last.id = 'square';
            };

            app.grid.view.change(app.grid.view.last.id);

            app.grid.style();

            this.size();

            this.max();

            app.grid.magnificationHide();

            app.grid.gridItemMax();

            document.documentElement.scrollTop = app.grid.view.last.scrollY;

            app.grid.view.last.id = 'solo';

            app.grid.view.last.scrollY = scrollPosition;

            app.message.render(app.grid.view.getActive().id.toUpperCase());

            break;

        }

      };

    });

  }

  this.render = () => {

    switch (mediaData.type) {

      case 'mp4':
      case 'webm':

        this.type = 'video';

        this.node.mediaItem = new Video({
          mediaData: mediaData,
          scrub: true,
          onLoadFunc: () => {

            this.size();

            this.max();

          }
        });

        break;

      case 'gif':
      case 'jpg':
      case 'jpeg':
      case 'png':

        this.type = 'image';

        this.node.mediaItem = new Image({
          mediaData: mediaData,
          onLoadFunc: () => {

            this.size();

            this.max();

          }
        });

        break;

    }

    this.node.detail.append(this.node.subreddit);

    this.node.detail.append(this.node.page);

    this.node.gridItem.append(this.node.detail);

    this.node.gridItem.append(this.node.mediaItem.getNode());

  }

  this.getNode = () => this.node.gridItem;

  this.render();

  this.bind();

}
