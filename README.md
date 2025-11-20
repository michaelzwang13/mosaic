# Mosaic

## Overview

Everyone has their own unique slice of life. From hobbies, favorite shows, and even personal recipes,
each person is composed of a mosaic of their own unique experiences and interests. 

Currently, there are no good ways to express this to the world. Instagram can be too curated and 
revealing, while LinkedIn is heavily career related and doesn't really show the other side of 
us human beings.

Mosaic is a web app that allows users to create a profile of themselves with the help of widgets
that can snap into a preset grid. People can choose from a variety of different blocks, ranging 
from a Youtube video, an inspirational quote, or even their favorite photo. The sheer customizability
means that users can reveal as much as they want, or as little as they want. The end goal is to 
share another side of themselves to the world that isn't so easy to do so otherwise. Users can 
register and login and also look at trending mosaics on their home page. 


## Data Model

The application will store Users and Widgets

* a user's page can have multiple widgets with the positions of each widget stored and persisted

An Example User:

```javascript
{
  username: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String }, // specific slug that links to user page (customizable)
  createdAt: { type: Date, default: Date.now() }
}
```

An Example Widget:

```javascript
{
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true }, 
  type: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  w: { type: Number, required: true }, 
  h: { type: Number, required: true },
  title: { type: String },
  description: { type: String },
  data: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

## [Link to Commented First Draft Schema](db.mjs) 

## Wireframes

/home - page for viewing trending pages, maybe implement search functionality later

![home](documentation/home-page.png)

/u/user-tag - user's public page (if toggled to public)

![user page](documentation/personal-page.png)

/customization - customization tool for user page

![customization](documentation/page-customization.png)

## Site map

![Site map](documentation/site-map.png)

## User Stories or Use Cases

1. as non-registered user, I can register a new account with the site
2. as non-registered user, I can view public pages with the url
3. as a user, I can log in to the site
4. as a user, I can edit my own page by adding/removing/moving blocks 
5. as a user, I can choose to make my page public or private
6. as a user, I can check out trending pages
7. as a user, I can add likes to other pages

## Research Topics

* (4 points) Integrate Gridstack.js
    * needed to implement the drag and drop functionalities
    * library seems to be pretty extensive 
* (2 points) Bootstrap with Sass CSS
    * for easier customization with themes
    * reusable ui components
* (3 points) Testing with Jest
    * unit testing with jest
* (1 point) Cloudinary API
    * storing and optimizing image uploads

10 points total out of 10 required points

## [Link to Initial Main Project File](app.mjs) 

## Annotations / References Used

1. [gridstack.js documentation](https://gridstackjs.com) 
2. [bootstrap with sass](https://getbootstrap.com/docs/5.0/customize/sass/)
3. [sass documentation](https://sass-lang.com/documentation/)
4. [jest testing framework](https://jestjs.io/)
6. [cloudinary api](https://console.cloudinary.com/app/c-0dd3b93c16481d41382a226768e92d/image/getting-started)

