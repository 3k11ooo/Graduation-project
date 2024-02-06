import { useEffect, useState } from "react";
import "./App.css";

function App(): JSX.Element {
  /**
   * 処理 → CloudFunctions
   *
   * 書き込み
   * テキストを入力する → Firestore
   * 画像ファイルをアップロード → Firestorage
   *
   * 読み込み
   * 表示する。
   *
   * はじめに画像とテキストのセットを3つ用意する
   * 追加も可能
   */
  const [isRead, setIsRead] = useState<boolean>(false);
  const [count, setCount] = useState<number>(0);
  const [text, setText] = useState<string>("");
  const [imgUrl, setImgUrl] = useState<string>("");
  const [formText, setFormText] = useState<string>("");
  const [formImg, setFormImg] = useState<File>();
  const [list, setList] = useState<{ text: string; imgUrl: string }[]>();
  useEffect(() => {
    async function fetchData() {
      let url = "";
      if (window.location.hostname === "localhost") {
        url = import.meta.env.VITE_LOCAL_READAPI;
      } else {
        url = import.meta.env.VITE_PRODUCTION_READAPI;
      }
      try {
        const response = await fetch(url, {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setList(data);
        } else {
          throw new Error("Network response was not ok.");
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
    fetchData();
  }, [count]);

  const loop =
    list !== undefined
      ? list.map((item, index) => (
          <li key={index}>
            <button
              onClick={() => {
                setText(item.text);
                setImgUrl(item.imgUrl);
                setIsRead(true);
              }}
            >
              {item.text}
            </button>
          </li>
        ))
      : [];

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("text", formText); // textはstring型
    if (formImg) {
      formData.append("img", formImg); // imgはFile型、undefinedの場合は追加しない
    }
    console.log(`Submit: {text: ${formText}, img: ${formImg?.name}}`);
    const option = {
      method: "POST",
      body: formData,
    };
    let url = "";
    if (window.location.hostname === "localhost") {
      url = import.meta.env.VITE_LOCAL_WRITEAPI;
    } else {
      url = import.meta.env.VITE_PRODUCTION_WRITEAPI;
    }
    const response = await fetch(url, option);
    console.log(response);
    setCount(count + 1);
  };

  return (
    <>
      <div className="app__write">
        <form onSubmit={handleSubmit}>
          <div className="app__formText">
            <label htmlFor="text">Text: </label>
            <input
              id="text"
              type="text"
              onChange={(e) => {
                setFormText(e.target.value);
              }}
              value={formText}
            />
          </div>
          <div className="app__formImg">
            <label htmlFor="image">Image: </label>
            <input
              id="image"
              type="file"
              onChange={(e) => {
                if (!e.target.files) return;
                const img = e.target.files[0];
                setFormImg(img);
              }}
            />
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
      <div className="app__list">
        <ul>{loop}</ul>
      </div>
      {isRead && <ReadComponent text={text} imgUrl={imgUrl} />}
    </>
  );
}

export default App;

const ReadComponent = (props: {
  text: string;
  imgUrl: string;
}): JSX.Element => {
  return (
    <div className="app__read">
      <div className="app__readText">
        <p>Text : {props.text}</p>
      </div>
      <div className="app__readImg">
        <p>Image : </p>
        <img src={props.imgUrl} alt={props.text + "'s image"} />
      </div>
    </div>
  );
};
