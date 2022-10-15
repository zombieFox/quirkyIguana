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
import { specialCharacters } from '../../utility/specialCharacters';

import './index.css';

export const GridItem = function(mediaData) {

  this.node = {
    gridItem: node('div|class:GridItem'),
    detail: node('div|class:GridItem__detail'),
    title: complexNode({
      tag: 'a',
      attr: [{ key: 'class', value: 'GridItem__page' }, { key: 'href', value: mediaData.page }, { key: 'target', value: '_blank' }],
    }),
    titleText: complexNode({
      tag: 'span',
      attr: [{ key: 'class', value: 'GridItem__title' }],
    }),
    titleIcon: new Icon('link', ['GridItem__icon']),
    subreddit: complexNode({
      tag: 'a',
      text: mediaData.subredditName,
      attr: [{ key: 'class', value: 'GridItem__subreddit' }, { key: 'href', value: mediaData.subreddit }, { key: 'target', value: '_blank' }]
    }),
    page: complexNode({
      tag: 'a',
      attr: [{ key: 'class', value: 'GridItem__page' }, { key: 'href', value: mediaData.page }, { key: 'target', value: '_blank' }],
    })
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

    let mediaItemWidth = this.mediaItem.node.content.clientWidth;

    let mediaItemHeight = this.mediaItem.node.content.clientHeight;

    let overflowX = (mediaItemWidth - gridItemWidth) / 2;

    let overflowY = (mediaItemHeight - gridItemHeight) / 2;

    let cursorPostionX = (event.clientX + window.scrollX) - this.node.gridItem.offsetLeft;

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
      (windowWidth / mediaData.gridItem.mediaItem.naturalWidth) <
      (windowHeight / mediaData.gridItem.mediaItem.naturalHeight)
    ) {

      this.node.gridItem.classList.add('GridItem__maxWidth');

    } else {

      this.node.gridItem.classList.add('GridItem__maxHeight');

    }

  }

  this.size = () => {

    applyCSSVar('--GridItem__mediaWidth', this.mediaItem.naturalWidth, this.node.gridItem);

    applyCSSVar('--GridItem__mediaHeight', this.mediaItem.naturalHeight, this.node.gridItem);

  }

  this.hide = () => {

    this.node.gridItem.classList.add('GridItem__hide');

  }

  this.show = () => {

    this.node.gridItem.classList.remove('GridItem__hide');

  }

  this.videoProgressHit = (event) => {

    let clickOnProgress = false;

    switch (this.type) {

      case 'video':

        clickOnProgress = event.path.includes(this.mediaItem.node.progress);

        break;

    }

    return clickOnProgress;

  }

  this.loadError = () => {

    this.node.gridItem.remove();

  }

  this.detail = {}

  this.detail.reset = () => {

    this.node.gridItem.classList.remove('GridItem__showDetail');

  }

  this.detail.check = (event) => {

    let rect = this.node.gridItem.getBoundingClientRect();

    let cursorPostionX = event.clientX - this.node.gridItem.offsetLeft;

    let cursorPostionY;

    switch (app.grid.view.getActive().id) {

      case app.grid.view.all.solo.id:

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

  this.mediaItem = null;

  this.bind = () => {

    this.node.gridItem.addEventListener('mousemove', event => {

      this.detail.check(event);

    });

    this.node.gridItem.addEventListener('mouseout', event => {

      this.detail.reset();

    });

    this.node.gridItem.addEventListener('mousemove', event => {

      if (event.shiftKey && app.grid.view.all.square.active) { this.pan.move(event); };

    });

    this.node.gridItem.addEventListener('click', event => {

      if (!event.altKey && !event.shiftKey && !this.videoProgressHit(event) && !event.path.includes(this.node.detail)) {

        switch (app.grid.view.getActive().id) {

          case app.grid.view.all.flex.id:
          case app.grid.view.all.square.id:
          case app.grid.view.all.line.id:

            app.grid.view.last.id = app.grid.view.getActive().id;

            app.grid.view.last.scroll.x = document.documentElement.scrollLeft;

            app.grid.view.last.scroll.y = document.documentElement.scrollTop;

            app.grid.view.change(app.grid.view.all.solo.id);

            app.grid.style();

            this.node.gridItem.scrollIntoView();

            app.grid.gridItemMax();

            app.grid.mediaInView();

            app.grid.mediaOutView();

            app.grid.inView();

            app.grid.outView();

            app.message.render(app.grid.view.all.solo.id.toUpperCase());

            break;

          case app.grid.view.all.solo.id:

            let scrollPositionY = document.documentElement.scrollTop;

            let scrollPositionX = document.documentElement.scrollLeft;

            if (app.grid.view.last.id === null || app.grid.view.last.id == app.grid.view.all.solo.id) {

              app.grid.view.last.id = app.grid.view.all.flex.id;

            };

            app.grid.view.change(app.grid.view.last.id);

            app.grid.style();

            app.grid.magnificationHide();

            app.grid.gridItemMax();

            app.grid.mediaInView();

            app.grid.mediaOutView();

            app.grid.inView();

            app.grid.outView();

            document.documentElement.scrollLeft = app.grid.view.last.scroll.x;

            document.documentElement.scrollTop = app.grid.view.last.scroll.y;

            app.grid.view.last.id = app.grid.view.all.solo.id;

            app.grid.view.last.scroll.x = scrollPositionX;

            app.grid.view.last.scroll.y = scrollPositionY;

            app.message.render(app.grid.view.getActive().id.toUpperCase());

            break;

        }

      };

    });

  }

  this.render = () => {

    switch (mediaData.type) {

      case 'video':

        this.type = 'video';

        this.mediaItem = new Video({
          mediaData: mediaData,
          scrub: true,
          onLoadFunc: () => {

            this.size();

            this.max();

          }
        });

        break;

      case 'image':

        this.type = 'image';

        this.mediaItem = new Image({
          mediaData: mediaData,
          onLoadFunc: () => {

            this.size();

            this.max();

          }
        });

        break;

    }

    this.node.titleText.textContent = specialCharacters(mediaData.title);

    this.node.title.append(this.node.titleText);

    this.node.title.append(this.node.titleIcon.getNode());

    this.node.detail.append(this.node.title);

    this.node.detail.append(this.node.subreddit);

    this.node.gridItem.append(this.node.detail);

    this.node.gridItem.append(this.mediaItem.getNode());

  }

  this.getNode = () => this.node.gridItem;

  this.render();

  this.bind();

}
