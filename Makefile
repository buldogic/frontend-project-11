install: 
	npm ci

 publish:
	 npm publish --dry-run

 lint:
	npx eslint .

lint fix:
	npx eslint --fix .

gendiff -h:
	node gendiff.js 

test:
	npm test 

test-coverage:
	npx jest --coverage