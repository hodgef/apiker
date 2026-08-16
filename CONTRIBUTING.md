# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue,
email, or any other method with the owners of this repository before working on a change.

Please note we have a code of conduct, please follow it in all your interactions with the project.

## Pull Request Guidelines

1. Please ensure your proposal will not radically change current functionality or bring along breaking changes.
2. PRs only consisting of typo fixes (or other automated contributions), will not be accepted.
3. Do not add any dependencies to the project.
4. Document your changes thoroughly.
5. Ensure that none of the tests fail.
6. Be reactive to any comments, reviews or change requests entered in your pull request.

## Working on the admin panel

The library is not a worker, so the panel's UI is developed against one. Run a project
that uses Apiker with `wrangler dev --local`, then start the sandbox here:

```
npm run dev:panel
```

It serves the panel from local source on `http://localhost:5010` and proxies every
`/admp` request to the worker, so the session, CSRF token and data are real while the
components rebuild on save. Point it elsewhere with `ADMP_TARGET`, and set
`ADMP_EMAIL` / `ADMP_PASSWORD` to sign in from `/dev/login` without typing credentials
into the page.
