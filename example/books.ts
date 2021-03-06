import { Router, RouterContext, Context, Status } from "https://deno.land/x/oak/mod.ts";
import { notFound } from "./helper.ts";

interface Book {
  id: string;
  title: string;
  author: string;
}

const books = new Map<string, Book>();

books.set("1", {
  id: "1",
  title: "The Hound of the Baskervilles",
  author: "Conan Doyle, Arthur",
});

const bookRouter = new Router();

bookRouter
  .get("/", (context) => {
    context.response.body = "Hello world!";
  })
  .get("/books", (context) => {
    context.response.body = Array.from(books.values());
  })
  .get("/books/:id", (context) => {
    if (context.params && books.has(context.params.id)) {
      context.response.body = books.get(context.params.id);
    } else {
      return notFound(context);
    }
  })
  .post("/book", async (context: RouterContext<"/book">) => {
    console.log("post book");
    if (!context.request.hasBody) {
      context.throw(Status.BadRequest, "Bad Request");
    }
    const body = context.request.body();
    let book: Partial<Book> | undefined;
    if (body.type === "json") {
      book = await body.value;
    } else if (body.type === "form") {
      book = {};
      for (const [key, value] of await body.value) {
        book[key as keyof Book] = value;
      }
    } else if (body.type === "form-data") {
      const formData = await body.value.read();
      book = formData.fields;
    }
    if (book) {
      context.assert(book.id && typeof book.id === "string", Status.BadRequest);
      books.set(book.id, book as Book);
      context.response.status = Status.OK;
      context.response.body = book;
      context.response.type = "json";
      return;
    }
    context.throw(Status.BadRequest, "Bad Request");
  })
  .delete("/books/:id", (context) =>{
    if (context.params && books.has(context.params.id)) {
      const status = books.delete(context.params.id);
      context.response.body = {"status": status}
    } else {
      return notFound(context);
    }
  });

export { bookRouter }