import Taro, { useLoad } from "@tarojs/taro";
import { Text, View } from "@tarojs/components";
import "./index.scss";

export default function Detail() {
  useLoad(() => {});

  return (
    <View className="detail-page">
      <Text>项目详情!</Text>
    </View>
  );
}
