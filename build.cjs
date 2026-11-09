const fs=require('fs'),path=require('path'),root=__dirname;
const names=['core.mjs','view.mjs','sdk.mjs','audio.mjs','app.mjs'];
// Each module gets a scope, preserving private helper names in the offline build.
let declarations='',modules={};
for(const [i,n]of names.entries()){
 let src=fs.readFileSync(path.join(root,n),'utf8'),exports=[...src.matchAll(/export\s+(?:function|const|let|class)\s+(\w+)/g)].map(m=>m[1]);
 src=src.replace(/^import \* as (\w+) from '\.\/(.*?)';$/gm,(_,alias,file)=>`const ${alias}=${modules[file]};`).replace(/^import \{(.*?)\} from '\.\/(.*?)';$/gm,(_,symbols,file)=>`const {${symbols}}=${modules[file]};`).replace(/\bexport\s+/g,'');
 const id='module'+i;modules[n]=id;declarations+=`const ${id}=(()=>{\n${src}\nreturn {${exports.join(',')}};})();\n`;
}
const icon='data:image/svg+xml,'+encodeURIComponent(fs.readFileSync(path.join(root,'icon.svg'),'utf8'));
let html=fs.readFileSync(path.join(root,'index-source.html'),'utf8').replace('href="icon.svg"',()=> 'href="'+icon+'"').replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync(path.join(root,'style.css'),'utf8')+'</style>').replace('<script src="vendor/three.min.js"></script>',()=>'<script>'+fs.readFileSync(path.join(root,'vendor/three.min.js'),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>').replace('<script type="module" src="app.mjs"></script>',()=>'<script>(()=>{'+declarations.replace(/<\/script/gi,'<\\/script')+'})();</script>');
for(const n of ['index.html','standalone.html'])fs.writeFileSync(path.join(root,n),html);
console.log('Built offline DYE DODGE '+Buffer.byteLength(html)+' bytes');


