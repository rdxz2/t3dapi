import { Router } from 'express';
import { resBase, resException, resNotFound } from '../Responses/resBase';
import rtFtJwt from '../RouteFilters/rtFtJwt';
import UserPreference from '../Models/mdlUserPreference';

const rtUserPreference = Router();

// get preferences (full)
rtUserPreference.get('/', rtFtJwt, async (request, response) => {
  // search user preference
  const repoUserPreference = (await UserPreference.findOne({ user: request.user.id }).select('-_id')) || {};

  return resBase(
    {
      is_dark_theme: repoUserPreference.is_dark_theme,
      color_primary_light: repoUserPreference.color_primary_light,
      color_primary_dark: repoUserPreference.color_primary_dark,
    },
    response
  );
});

// get preferences (theme)
rtUserPreference.get('/theme', rtFtJwt, async (request, response) => {
  // search user preference
  const repoUserPreference = (await UserPreference.findOne({ user: request.user.id }).select('-_id is_dark_theme color_primary_light color_primary_dark')) || {};

  return resBase(
    {
      is_dark_theme: repoUserPreference.is_dark_theme,
      color_primary_light: repoUserPreference.color_primary_light,
      color_primary_dark: repoUserPreference.color_primary_dark,
    },
    response
  );
});

// set preference (dark theme)
rtUserPreference.post('/darktheme', rtFtJwt, async (request, response) => {
  // search user preference
  const tbuRepoUserPreference = await UserPreference.findOne({ user: request.user.id }).select('is_dark_theme');
  if (!tbuRepoUserPreference) return resNotFound('preference', response);

  // edit user preference
  tbuRepoUserPreference.is_dark_theme = request.body.is_dark_theme;

  try {
    // save user preference
    const tbuRepoUserPreferenceSaved = await tbuRepoUserPreference.save();

    return resBase(tbuRepoUserPreferenceSaved.is_dark_theme, response);
  } catch (error) {
    return resException(error, response);
  }
});

// set preference (light theme primary color)
rtUserPreference.post('/primarylight', rtFtJwt, async (request, response) => {
  // search user preference
  const tbuRepoUserPreference = await UserPreference.findOne({ user: request.user.id }).select('color_primary_light');
  if (!tbuRepoUserPreference) return resNotFound('preference', response);

  // edit user preference
  tbuRepoUserPreference.color_primary_light = request.body.color;

  try {
    // save user preference
    const tbuRepoUserPreferenceSaved = await tbuRepoUserPreference.save();

    return resBase(tbuRepoUserPreferenceSaved.color_primary_light, response);
  } catch (error) {
    return resException(error, response);
  }
});

// set preference (dark theme primary color)
rtUserPreference.post('/primarydark', rtFtJwt, async (request, response) => {
  // search user preference
  const tbuRepoUserPreference = await UserPreference.findOne({ user: request.user.id }).select('color_primary_dark');
  if (!tbuRepoUserPreference) return resNotFound('preference', response);

  // edit user preference
  tbuRepoUserPreference.color_primary_dark = request.body.color;

  try {
    // save user preference
    const tbuRepoUserPreferenceSaved = await tbuRepoUserPreference.save();

    return resBase(tbuRepoUserPreferenceSaved.color_primary_dark, response);
  } catch (error) {
    return resException(error, response);
  }
});

export default rtUserPreference;
