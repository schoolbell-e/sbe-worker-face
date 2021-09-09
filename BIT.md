## Bit
### Inital setup process log
Followed the blog

#### Bit installation and init
```
npm i -g @teambit/bvm
bvm install
cd an existing folder
bit init --harmony
```

#### Created Node-typescript env customization
Created a custom node env to be shared
```
bit create node-env extensions/custom-node
// modify the auto-generated files.
bit tag --all
bit export
```

### Custom-node env modification
If you want to update node env and see if it works with other components, 
```
// update worksapce.jsonc to be pointed at the local verion of the env instead of the remote one().
// ex > "schoolbell-e.backend/extensions/custom-node@x.x.x": {} => "extensions/custom-node": {} 
// update custom node files
bit compile extensions/custom-node // MUST
bit tag {name}
```

### Adding and exporting a new component
```
bit add src/shared/{name}
bit tag {name}
bit export
```

### Build Process 
In docker add these two lines.
```
bit install // install packages
bit compile // build dist inside node_modules for bit components. 
```


### Update process
```
bit import
bit checkout latest schoolbell-e.backend/*
```
