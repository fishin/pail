## Functions
<dl>
<dt><a href="#deleteDir">deleteDir(dir)</a></dt>
<dd><p>delete a directory</p>
</dd>
<dt><a href="#getArtifact">getArtifact(dir, artifact)</a> ⇒ <code>string</code></dt>
<dd><p>get contents of an artifact</p>
</dd>
<dt><a href="#copyArtifact">copyArtifact(sourceDir, targetDir, artifact)</a></dt>
<dd><p>copy an artifact</p>
</dd>
<dt><a href="#createDir">createDir(dir)</a></dt>
<dd><p>create a directory</p>
</dd>
<dt><a href="#getFiles">getFiles(dir)</a> ⇒ <code>Array</code></dt>
<dd><p>get files</p>
</dd>
<dt><a href="#getPails">getPails()</a> ⇒ <code>Array</code></dt>
<dd><p>get pails</p>
</dd>
<dt><a href="#createPail">createPail(config)</a> ⇒ <code>object</code></dt>
<dd><p>create pail</p>
</dd>
<dt><a href="#updatePail">updatePail(config)</a> ⇒ <code>object</code></dt>
<dd><p>update pail</p>
</dd>
<dt><a href="#getPail">getPail(pailId)</a> ⇒ <code>object</code></dt>
<dd><p>get pail</p>
</dd>
<dt><a href="#deletePail">deletePail(pailId)</a></dt>
<dd><p>delete pail</p>
</dd>
<dt><a href="#createName">createName(pailId, name)</a></dt>
<dd><p>create name</p>
</dd>
<dt><a href="#deleteName">deleteName(name)</a></dt>
<dd><p>delete name</p>
</dd>
<dt><a href="#getLinks">getLinks(pailId)</a> ⇒ <code>Array</code></dt>
<dd><p>get links</p>
</dd>
<dt><a href="#getPailByName">getPailByName(name)</a> ⇒ <code>object</code></dt>
<dd><p>get pail by name</p>
</dd>
</dl>
<a name="deleteDir"></a>
## deleteDir(dir)
delete a directory

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| dir | <code>string</code> | relative directory to delete |

<a name="getArtifact"></a>
## getArtifact(dir, artifact) ⇒ <code>string</code>
get contents of an artifact

**Kind**: global function  
**Returns**: <code>string</code> - contents - contents of artifact  

| Param | Type | Description |
| --- | --- | --- |
| dir | <code>string</code> | relative directory where its stored |
| artifact | <code>string</code> | artifact |

<a name="copyArtifact"></a>
## copyArtifact(sourceDir, targetDir, artifact)
copy an artifact

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| sourceDir | <code>string</code> | relative source directory |
| targetDir | <code>string</code> | relative target directory |
| artifact | <code>string</code> | artifact you want to copy |

<a name="createDir"></a>
## createDir(dir)
create a directory

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| dir | <code>string</code> | relative directory to create |

<a name="getFiles"></a>
## getFiles(dir) ⇒ <code>Array</code>
get files

**Kind**: global function  
**Returns**: <code>Array</code> - files  

| Param | Type | Description |
| --- | --- | --- |
| dir | <code>string</code> | get all filenames in the relative directory |

<a name="getPails"></a>
## getPails() ⇒ <code>Array</code>
get pails

**Kind**: global function  
**Returns**: <code>Array</code> - pails - get all pailIds  
<a name="createPail"></a>
## createPail(config) ⇒ <code>object</code>
create pail

**Kind**: global function  
**Returns**: <code>object</code> - config - return object with updates  

| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | create a pail from a given config object |

<a name="updatePail"></a>
## updatePail(config) ⇒ <code>object</code>
update pail

**Kind**: global function  
**Returns**: <code>object</code> - config - return object with updates  

| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | update a pail from a given config object |

<a name="getPail"></a>
## getPail(pailId) ⇒ <code>object</code>
get pail

**Kind**: global function  
**Returns**: <code>object</code> - config - return object with specified pailId  

| Param | Type |
| --- | --- |
| pailId | <code>String</code> | 

<a name="deletePail"></a>
## deletePail(pailId)
delete pail

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| pailId | <code>String</code> | deletes pail |

<a name="createName"></a>
## createName(pailId, name)
create name

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| pailId | <code>String</code> | id |
| name | <code>String</code> | name you want to create |

<a name="deleteName"></a>
## deleteName(name)
delete name

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | name you want to delete |

<a name="getLinks"></a>
## getLinks(pailId) ⇒ <code>Array</code>
get links

**Kind**: global function  
**Returns**: <code>Array</code> - names  

| Param | Type | Description |
| --- | --- | --- |
| pailId | <code>String</code> | get all the names for a given id |

<a name="getPailByName"></a>
## getPailByName(name) ⇒ <code>object</code>
get pail by name

**Kind**: global function  
**Returns**: <code>object</code> - pail  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | get pail from name |

