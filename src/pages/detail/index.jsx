import { useState } from "react";
import Taro, { useLoad } from "@tarojs/taro";
import { View } from "@tarojs/components";
import { Button, Cell, Navbar } from "@taroify/core";
import "./index.scss";

export default function Detail() {
  const [isH5] = useState(() => Taro.getEnv() === "WEB");
  const [detailData, setDetailData] = useState({});
  useLoad(() => {
    const eventChannel = Taro.getCurrentInstance().page.getOpenerEventChannel();
    eventChannel.on("updateProjectData", (data) => {
      setDetailData(data);
    });
  });

  const onBack = () => {
    // 当前的页面栈只有1个时，直接 redirectTo 首页
    if (Taro.getCurrentPages().length <= 1) {
      Taro.redirectTo({
        url: "/pages/project/index",
      });
    } else {
      Taro.navigateBack({
        delta: 1,
      });
    }
  };

  const onDecrypt = () => {
    console.log("🚀 ~ onDecrypt ~ 开始解密");
  };

  return (
    <View className="detail-page" style={!isH5 ? { padding: "10px 0" } : {}}>
      {isH5 && (
        <Navbar title="项目详情">
          <Navbar.NavLeft onClick={onBack}></Navbar.NavLeft>
        </Navbar>
      )}
      <View
        className="detail-container"
        key={detailData.id}
        style={isH5 ? { margin: "10px" } : {}}
      >
        <Cell title="项目名称：">
          <View className="taroify-ellipsis--l2">{detailData.projectName}</View>
        </Cell>
        <Cell title="开标时间：" align="end">{detailData.openBidTime}</Cell>
        <Cell title="类型：" align="end">{detailData.type}</Cell>
        <View className="btn-wrapper">
          <Button
            variant="outlined"
            color="primary"
            size="mini"
            onClick={onDecrypt}
          >
            开始解密
          </Button>
        </View>
      </View>
    </View>
  );
}
