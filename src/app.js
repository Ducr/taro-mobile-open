
import { useLaunch } from '@tarojs/taro'
// 使用Style 内置样式
import "@taroify/core/styles/index.css"
import "./utils/request.js"; // 使用封装后的request
import './app.scss'

function App({ children }) {
  useLaunch(() => {
    console.log('App launched.')
  })

  // children 是将要会渲染的页面
  return children
}



export default App
