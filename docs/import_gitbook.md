# Import des gitbooks
<br/>

1. Se mettre soit sur la branche de dev soit sur une nouvelle branche (feat/articles par exemple)
<br/><br/>

2. Faire un cherry-pick des derniers articles de la branche feat/content (normalement les comments commencent par "GITBOOK)
    - Si erreurs de merge, TOUJOURS prendre la version qui est sur feat/content
<br/><br/>

3. Dans src/data/contents : tout le contenu des articles (.md et images)
    - SUMMARY.md : le listing des articles du gitbook
    - index.ts : le listing des articles sur le site FCU
<br/><br/>

4. Déplacer les images dans public/contents
<br/><br/>

5. Modifier le index.ts pour ajouter les nouveaux articles dans *articles*
    - Les 4 champs sont obligatoires
    - Pour *slug*, convertir *title* en kebab case
    - Il faudra peut-être modifier les anciens si le nom du *content* a changé 
<br/><br/>

6. Dans les nouveaux .md ou ceux qui ont été modifiés, supprimer le header <br/>
Exemple : 
```
 ---
 cover: .gitbook/assets/24.jpg
 coverY: 0
 ---
```
 