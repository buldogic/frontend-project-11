import i18n from 'i18next';
import * as yup from 'yup';
import { v4 } from 'uuid';
import axios from 'axios';
import ru from './ru.js';
import watchedState from './watcher.js';
import parse from './parser.js';

const app = (textLib) => {
  yup.setLocale({
    string: {
      url: textLib.t('errors.urlError'),
      required: textLib.t('errors.requiredError'),
    },
  });

  const validateUrl = (text, model) => {
    const schema = yup.string()
      .url()
      .required()
      .notOneOf(model.feeds.map((f) => f.link), textLib.t('errors.notOneOfError'));
    return schema
      .validate(text)
      .then(() => null)
      .catch((e) => e.message);
  };

  const fakeDocument = typeof document === 'undefined' ? {} : document;

  const elements = {
    form: fakeDocument.querySelector('form'),
    submit: fakeDocument.querySelector('button[type="submit"]'),
    feedback: fakeDocument.querySelector('.feedback'),
    inputField: fakeDocument.getElementById('url-input'),
    feedsContainer: fakeDocument.querySelector('.feeds'),
    postsContainer: fakeDocument.querySelector('.posts'),
    modalTitle: fakeDocument.querySelector('.modal-title'),
    modalBody: fakeDocument.querySelector('.modal-body'),
    openFull: fakeDocument.querySelector('.full-article'),
  };

  const state = {
    form: {
      error: null,
    },
    feeds: [],
    posts: [],
    activePost: null,
    seenPosts: [],
    loading: 'ok',
  };

  const watcher = watchedState(state, elements, textLib);

  const setError = (e) => {
    if (e.message === 'Network Error') {
      watcher.form.error = textLib.t('errors.connectionError');
    } else if (e.isParseError) {
      watcher.form.error = textLib.t('errors.rssError');
    } else {
      watcher.form.error = textLib.t('errors.unknownError');
    }
  };

  const addProxy = (url) => {
    const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
    urlWithProxy.searchParams.set('url', url);
    urlWithProxy.searchParams.set('disableCache', 'true');
    return urlWithProxy.toString();
  };

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    validateUrl(url, watcher).then((err) => {
      if (err) {
        watcher.form.error = err;
      } else {
        watcher.loading = 'processing';
        axios.get(addProxy(url))
          .then((response) => {
            const data = parse(response.data.contents);
            watcher.form.error = null;
            const newFeed = {
              id: v4(), link: url, title: data.title, description: data.description,
            };
            watcher.feeds.push(newFeed);
            data.items.forEach((item) => {
              let post = { feedID: newFeed.id, id: v4() };
              post = { ...item, ...post };
              watcher.posts.push(post);
            });
            watcher.loading = 'ok';
          })
          .catch((error) => {
            setError(error);
            watcher.loading = 'failure';
          });
      }
    });
  });

  elements.postsContainer.addEventListener('click', (e) => {
    if (!e.target.dataset.id) {
      return;
    }

    watcher.activePost = e.target.dataset.id;
    if (!watcher.seenPosts.includes(e.target.dataset.id)) {
      watcher.seenPosts.push(e.target.dataset.id);
    }
  });

  const checkNewPosts = () => {
    const feedsPromises = state.feeds.map((feed) => axios.get(addProxy(feed.link))
      .then((response) => {
        const oldPostsLinks = state.posts
          .filter((oldPost) => oldPost.feedID === feed.id)
          .map((el) => el.link);
        const data = parse(response.data.contents);
        data.items.forEach((item) => {
          if (!oldPostsLinks.includes(item.link)) {
            let newPost = { feedID: feed.id, id: v4() };
            newPost = { ...item, newPost };
            watcher.posts.push(newPost);
          }
        });
      })
      .catch((error) => {
        if (error.message === 'Network Error') {
          watcher.form.error = textLib.t('errors.connectionError');
        } else {
          console.log(error.message);
        }
      }));
    Promise.all([...feedsPromises])
      .finally(setTimeout(checkNewPosts, 5000));
  };

  setTimeout(checkNewPosts, 5000);
};

const runApp = () => {
  const i18nextInstance = i18n.createInstance();

  i18nextInstance
    .init({
      lng: 'ru',
      debug: true,
      resources: {
        ru,
      },
    })
    .then(() => app(i18nextInstance));
};

export default runApp;
