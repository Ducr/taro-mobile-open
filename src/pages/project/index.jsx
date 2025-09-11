import { useRef, useState } from "react";
import Taro, { useLoad, usePageScroll } from "@tarojs/taro";
import { View } from "@tarojs/components";
import { Button, Cell, List, Loading, PullRefresh, Space } from "@taroify/core";
import CTabBar from "../../components/CTabBar";
import "./index.scss";

export default function Project() {
  const [hasMore, setHasMore] = useState(true);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const refreshingRef = useRef(false);
  const [reachTop, setReachTop] = useState(true);

  useLoad(() => {});

  const onChangeTabItem = (value) => {
    if (value === 1) {
      Taro.navigateTo({
        url: "/pages/my/index",
      });
    }
  };

  const goToProjectDetail = (data) => {
    Taro.navigateTo({
      url: "/pages/detail/index?",
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit("updateProjectData", data);
      },
    });
  };

  usePageScroll(({ scrollTop: aScrollTop }) => {
    setReachTop(aScrollTop === 0);
  });

  const onLoad = () => {
    setLoading(true);
    const newList = refreshingRef.current ? [] : list;
    setTimeout(() => {
      refreshingRef.current = false;
      for (let i = 0; i < 10; i++) {
        newList.push({
          projectName: `${newList.length + 1}-广州市白云区龙归街地皮招标`,
          openBidTime: `2025-09-11 12:00:00`,
          type: "建设工程",
          id: String(Math.random()).slice(2),
        });
      }
      setList(newList);
      setLoading(false);
      setHasMore(newList.length < 20);
    }, 1000);
  };

  const onRefresh = () => {
    refreshingRef.current = true;
    setLoading(false);
    onLoad();
  };

  return (
    <View className="project-page">
      <PullRefresh
        loading={refreshingRef.current}
        reachTop={reachTop}
        onRefresh={onRefresh}
      >
        <List loading={loading} hasMore={hasMore} onLoad={onLoad}>
          <Space direction="vertical" fill={true}>
            {list.map((item) => (
              <View className="project-item" key={item.id}>
                <Cell title="项目名称：">
                  <View className="taroify-ellipsis--l2">
                    {item.projectName}
                  </View>
                </Cell>
                <Cell title="开标时间：" align="end">{item.openBidTime}</Cell>
                <Cell title="类型：" align="end">{item.type}</Cell>
                <View className="btn-wrapper">
                  <Button
                    color="primary"
                    size="mini"
                    onClick={() => goToProjectDetail(item)}
                  >
                    进入项目
                  </Button>
                </View>
              </View>
            ))}
          </Space>
          {!refreshingRef.current && (
            <List.Placeholder>
              {loading && <Loading>加载中...</Loading>}
              {!hasMore && "没有更多了"}
            </List.Placeholder>
          )}
        </List>
      </PullRefresh>
      <CTabBar value={0} onChange={onChangeTabItem} />
    </View>
  );
}
