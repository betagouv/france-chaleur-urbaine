import axios from 'axios';

const fetch = async () => {
  for (let i = 0; i < 1000; i++) {
    await Promise.all(
      [...Array(50).keys()].map(() =>
        axios.get(
          'https://france-chaleur-urbaine-dev.osc-fr1.scalingo.io/api/demands'
          //'https://france-chaleur-urbaine-dev-pr499.osc-fr1.scalingo.io/api/demands'
        )
      )
    );
    console.log(i);
  }
};

fetch();
