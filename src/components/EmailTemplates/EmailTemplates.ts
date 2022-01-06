export const wrapEmailTemplate = (title: string, content: string) => `
<html>
<head></head>
<body>
    <h1>${title}</h1>
    <div>
        ${content}
    </div>
</body>
</html>
`