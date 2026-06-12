const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          if (file.includes('.git') || file.includes('node_modules')) {
            next();
          } else {
            walk(file, (err, res) => {
              results = results.concat(res);
              next();
            });
          }
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

walk('.', (err, results) => {
  if (err) throw err;
  results.forEach(file => {
    if (file.match(/\.(js|jsx|ts|tsx|json|md)$/)) {
      let content = fs.readFileSync(file, 'utf8');
      let changed = false;
      
      // WeebHub Nexus (Capitalized)
      if (content.includes('WeebHub Nexus')) {
        content = content.replace(/WeebHub Nexus/g, 'WeebHub Nexus');
        changed = true;
      }
      
      // weebhub-nexus (Lowercase)
      if (content.includes('weebhub-nexus')) {
        // Avoid replacing weebhub-nexus in things like "sweebhub-nexuspt" if they exist, but 'weebhub-nexus' is pretty unique.
        // To be safe we will just replace 'weebhub-nexus' with 'weebhub-nexus' but watch out for 'weebhub-nexus' inside other words.
        // Actually, just global replace is fine for this project name.
        content = content.replace(/weebhub-nexus/g, 'weebhub-nexus');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
      }
    }
  });
});
