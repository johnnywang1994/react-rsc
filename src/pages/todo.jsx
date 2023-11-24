import fetch from "node-fetch";

export default async function Todo() {
  const res = await fetch("https://jsonplaceholder.typicode.com/todos");
  const todoList = await res.json();
  return (
    <div>
      {todoList.map((todo) => (
        <div key={todo.id}>
          {todo.id}. {todo.title}
        </div>
      ))}
    </div>
  );
}
