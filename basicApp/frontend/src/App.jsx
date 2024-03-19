import { useEffect, useState } from 'react'
import './App.css'
import axios from 'axios'

function App() {
  const [jokes, setJokes] = useState([])

  useEffect(()=>{
    axios.get("/api/jokes")
    .then((response)=>{
      setJokes(response.data)
    })
    .catch((error)=>{
      console.log(error)
    })
  })

  return (
    <>
      <h1>Hello world</h1>
      <p>jokes : {jokes.length}</p>

      {jokes.map((jokes)=>{
        return(
        <div key={jokes.id}>
          <h3> title:{jokes.title} </h3>
          <p>content:{jokes.content} </p>
        </div>)
      })}
    </>
  )
}

export default App
