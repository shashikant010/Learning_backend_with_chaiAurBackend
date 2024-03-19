import express from "express";
const app =express();
app.get("/",(req,res)=>{
    res.send("hi i am server");
})

const port=process.env.PORT||3000;

app.get("/jokes",(req,res)=>{
    const jokes=[
        {
            id:1,
            title:"joke1",
            content:"this is joke 1"
        },
        {
            id:2,
            title:"joke2",
            content:"this is joke 2"
        },
        {
            id:3,
            title:"joke3",
            content:"this is joke 3"
        },
        {
            id:4,
            title:"joke4",
            content:"this is joke 4"
        }
    ]
    res.send(jokes)
})

app.listen(port,()=>{
    console.log(`app listening at https://localhost:${port}`)
})