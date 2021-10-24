import React, { useMemo } from "react";
import { Box, BoxProps, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import cls from "classnames";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";
import { toBech32Address } from "@zilliqa-js/crypto";
import { darken } from '@material-ui/core/styles';
import { ArkBox, FancyButton, ZapWidget } from "app/components";
import { getWallet } from "app/saga/selectors";
import { actions } from "app/store";
import { Nft } from "app/store/types";
import { AppTheme } from "app/theme/types";
import { useBlockTime } from "app/utils";
import { InfoBox, PrimaryPrice, SecondaryPrice } from "./components";
import { PriceInfo, PriceType } from "./types";

interface Props extends BoxProps {
  token?: Nft;
  tokenId: string;
  tokenUpdatedCallback: () => void;
}

const SalesDetail: React.FC<Props> = (props: Props) => {
  const { token, tokenId, children, className, tokenUpdatedCallback, ...rest } = props;
  const classes = useStyles();
  const history = useHistory();
  const dispatch = useDispatch();
  const { wallet } = useSelector(getWallet);
  const [blockTime, currentBlock] = useBlockTime();

  const isOwnToken = useMemo(() => {
    return (
      token?.owner?.address &&
      wallet?.addressInfo.byte20?.toLowerCase() === token?.owner?.address
    );
  }, [token, wallet?.addressInfo]);

  // compute where price information should be displayed
  const priceInfos: {
    primaryPrice?: PriceInfo,
    secondaryPrice1?: PriceInfo,
    secondaryPrice2?: PriceInfo,
  } = {}
  if (token?.bestAsk) {
    priceInfos.primaryPrice = {
      type: PriceType.BestAsk,
      cheque: token.bestAsk
    }
  }
  if (token?.bestBid) {
    const entry = priceInfos.primaryPrice ? 'secondaryPrice1' : 'primaryPrice'
    priceInfos[entry] = {
      type: PriceType.BestBid,
      cheque: token.bestBid
    }
  }
  if (token?.lastTrade) {
    const entry = priceInfos.primaryPrice ? (priceInfos.secondaryPrice1 ? 'secondaryPrice2' : 'secondaryPrice1') : 'primaryPrice'
    priceInfos[entry] = {
      type: PriceType.LastTrade,
      cheque: token.lastTrade,
    }
  }

  const onSell = () => {
    if (!token?.collection?.address) return;
    history.push(`/ark/collections/${toBech32Address(token.collection.address)}/${token.tokenId}/sell`);
  }

  const onBuy = () => {
    dispatch(actions.Layout.toggleShowBuyNftDialog("open"));
  };

  const onBid = () => {
    dispatch(actions.Layout.toggleShowBidNftDialog("open"));
  };

  const onCancel = () => {
    dispatch(actions.Layout.toggleShowCancelSellNftDialog("open"));
  };

  return (
    <Box {...rest} className={cls(classes.root, className)}>
      <Box className={classes.container}>
        {/* Collection name */}
        <Typography className={classes.collectionName}>
          {token?.collection?.name ?? ""}{" "}
          {/* <VerifiedBadge className={classes.verifiedBadge} /> */}
        </Typography>

        {/* Token id */}
        <Typography className={classes.tokenId}><span className={classes.hexSymbol}>#</span>{tokenId}</Typography>

        <Box mt={2} display="flex" flexDirection="column">
          <Box className={classes.infoBoxContainer}>
            {/* <InfoBox topLabel="ARK Score" bottomLabel="Top 51.1%" tooltip={""} flex={1}>
              <Typography className={classes.rarityLabel} variant="h3">SUPAH RARE</Typography>
            </InfoBox> */}

            <InfoBox topLabel="ZAPs" bottomLabel="Like it? ZAP it!">
              <ZapWidget onZap={tokenUpdatedCallback} token={token} />
            </InfoBox>
          </Box>
          <ArkBox className={classes.saleInfoContainer}>
            {priceInfos.primaryPrice && <PrimaryPrice data={priceInfos.primaryPrice} blockTime={blockTime} currentBlock={currentBlock} />}
            {priceInfos.secondaryPrice1 && <SecondaryPrice data={priceInfos.secondaryPrice1} blockTime={blockTime} currentBlock={currentBlock} mr={2} />}
            {priceInfos.secondaryPrice2 && <SecondaryPrice data={priceInfos.secondaryPrice2} blockTime={blockTime} currentBlock={currentBlock} />}
          </ArkBox>
          <Box display="flex" className={classes.buttonBox}>
            {!isOwnToken && (
              <FancyButton containerClass={classes.button} className={classes.bidButton} disableRipple onClick={onBid}>
                Place Bid
              </FancyButton>
            )}
            {isOwnToken && token?.bestAsk && (
              <FancyButton containerClass={classes.button} className={classes.bidButton} disableRipple onClick={onCancel}>
                Cancel Listing
              </FancyButton>
            )}
            {isOwnToken && token?.collection && (
              <FancyButton containerClass={classes.button} className={classes.buyButton} disableRipple onClick={onSell}>
                {token.bestAsk ? "Lower Price" : "Sell"}
              </FancyButton>
            )}
            {!isOwnToken && token?.bestAsk && (
              <FancyButton containerClass={classes.button} className={classes.buyButton} disableRipple onClick={onBuy}>
                Buy Now
              </FancyButton>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const useStyles = makeStyles((theme: AppTheme) => ({
  root: {
    borderRadius: theme.spacing(1.5),
    border: theme.palette.border,
    color: theme.palette.text!.primary,
    boxShadow: theme.palette.type === "dark" ? "0px 4px 20px #002028" : 'none',
    background: theme.palette.type === "dark" ? "linear-gradient(173.54deg, #12222C 42.81%, #002A34 94.91%)" : "transparent",
  },
  container: {
    display: "flex",
    width: "100%",
    flexDirection: "column",
    padding: theme.spacing(8, 9, 5, 6),
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(2, 3),
      textAlign: "center",
      width: "100%",
    },
  },
  tokenId: {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 600,
    fontSize: "36px",
    lineHeight: "36px",
    marginTop: theme.spacing(0.5),
    [theme.breakpoints.down("sm")]: {
      marginTop: theme.spacing(0),
      marginBottom: theme.spacing(1),
    },
  },
  hexSymbol: {
    fontSize: '30px',
  },
  buttonBox: {
    transform: "translateY(-50%)",
    width: "100%",
    padding: theme.spacing(0, 4),
    display: "flex",
    [theme.breakpoints.down("xs")]: {
      marginTop: theme.spacing(2),
      transform: "translateY(0%)",
      padding: theme.spacing(0),
    },
  },
  button: {
    flex: 1,
    marginRight: theme.spacing(.5),
    maxWidth: 280,
  },
  bidButton: {
    padding: theme.spacing(2.5, 4),
    borderRadius: theme.spacing(1.5),
    backgroundColor: "#6BE1FF",
    "& .MuiButton-label": {
      color: "#003340",
    },
    "&:hover": {
      border: 'none',
      backgroundColor: darken("#6BE1FF", 0.1),
      "& .MuiButton-label": {
        color: darken("#003340", 0.1),
      },
    },
    [theme.breakpoints.down("xs")]: {
      display: "flex",
      width: "100%",
    },
  },
  buyButton: {
    padding: theme.spacing(2.5, 4),
    borderRadius: theme.spacing(1.5),
    border: theme.palette.border,
    backgroundColor: "#FFDF6B",
    "& .MuiButton-label": {
      color: "#003340",
    },
    "&:hover": {
      "& .MuiButton-label": {
        color: "#DEFFFF",
      },
    },
  },
  collectionName: {
    fontFamily: "'Raleway', sans-serif",
    fontWeight: 900,
    fontSize: "18px",
    lineHeight: "24px",
    letterSpacing: "0.2px",
  },
  infoBoxContainer: {
    display: "flex",
    marginRight: theme.spacing(-1),
    marginBottom: theme.spacing(-2),
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
  },
  saleInfoContainer: {
    display: "flex",
    flexDirection: "column",
    marginTop: theme.spacing(3),
    minHeight: theme.spacing(5),
    padding: theme.spacing(2.5, 4, 7),
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(2, 3),
      alignItems: "center"
    },
  },
  rarityLabel: {
    color: "#7B61FF",
    fontFamily: "Avenir Next",
    fontWeight: 900,
    textAlign: "center",
    WebkitTextStroke: "4px #7B61FF33"
  },
}));

export default SalesDetail;
