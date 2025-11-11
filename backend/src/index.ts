import app from './app';
import 'dotenv/config'
// require("dotenv").config();
const port = process.env.PORT || 8000;
app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  

  /* eslint-enable no-console */
});