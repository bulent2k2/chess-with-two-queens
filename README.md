# To build
`npm install`
# To run a development server
`npm run dev`
# Info on design
I had written an Othello game board for the wonderful open source [Kojo learning environment](https://sites.google.com/view/knownot/fun-learning-with-kojo). It supports variable board sizes (4x4, 9x9, etc. as well as the traditional 8x8). That had given me the inspiration to have a 9x9 chess board, too. It would have two queens for double the fun 😇. After a few years, and after having heard the legendary Steve Wozniak of the Apple fame praising famous.ai on vibe coding, I gave it a try. I had a longish conversation with famous.ai. After a few iterations, it helped me create a 9x9, or optionally 9x8, chess board with two queens each. famous.ai makes it easy to deploy, but hosting costs a lot more than the montly minimum of $7.99 or some similarly small amount. So, I put that to sleep there and revived the code here. As mentioned above, it's fairly easy to build and run it for yourselves until I get the time (and expertise) to get it hosted somewhere online on a small budget. 
# Info on code
Uses [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/) from a template that provides a minimal setup to get React working in Vite with HMR, the [*hot module replacement* feature](https://vite.dev/guide/api-hmr), and some [ESLint rules](https://eslint.org/docs/latest/rules/).
# Next steps
Needless to say, there is a lot more that can and needs to be added to make this easier to play with and more fun. Online game play doesn't really work. AI mode does work, but would benefit from an option to increase the search depth. I hope some of you coding wizards can take this from here and help make it shine...
