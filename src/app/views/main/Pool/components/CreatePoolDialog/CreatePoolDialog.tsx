import { DialogContent, makeStyles, Typography } from "@material-ui/core";
import { DialogModal, FancyButton } from "app/components";
import { actions } from "app/store";
import { RootState, TokenInfo, TokenState, WalletState } from "app/store/types";
import { useAsyncTask } from "app/utils";
import cls from "classnames";
import { BN } from "core/zilswap";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AddressInput } from "./components";
import { TokenPreview } from "./components/AddressInput/AddressInput";

const useStyles = makeStyles(theme => ({
  root: {
  },
  content: {
    display: "flex",
    flexDirection: "column",
    width: 516,
    [theme.breakpoints.down("xs")]: {
      width: 380,
    },
  },
  actionButton: {
    height: 46,
    marginBottom: theme.spacing(6),
  },
  error: {
    marginBottom: theme.spacing(2),
  },
}));

const CreatePoolDialog = (props: any) => {
  const { children, className, open, onCloseDialog, ...rest } = props;
  const classes = useStyles();
  const dispatch = useDispatch();
  const [tokenPreview, setTokenPreview] = useState<TokenPreview | undefined>();
  const [runAsyncTask, loading, error] = useAsyncTask("createPool");
  const walletState = useSelector<RootState, WalletState>(state => state.wallet);
  const tokenState = useSelector<RootState, TokenState>(state => state.token);

  const onCreatePool = () => {
    if (loading) return;

    runAsyncTask(async () => {
      if (!walletState.wallet)
        throw new Error("Connect wallet to create pool");
      if (!tokenPreview) throw new Error("Address not valid");
      const { address } = tokenPreview;
      if (tokenState.tokens[address])
        throw new Error(`Pool for ${tokenPreview.symbol} already exists`);

      const token: TokenInfo = {
        address,
        initialized: false,
        isZil: false,
        dirty: false,
        whitelisted: false,
        symbol: tokenPreview.symbol,
        name: tokenPreview.name,
        decimals: tokenPreview.decimals,
        balance: new BN(0),
        init_supply: tokenPreview.init_supply,
        balances: tokenPreview.balances,
        allowances: {},
      };
      dispatch(actions.Token.add({ token }));
      dispatch(actions.Pool.select({ token }));

      return onCloseDialog();
    });
  };

  return (
    <DialogModal header="Create Pool" open={open} onClose={onCloseDialog} {...rest} className={cls(classes.root, className)}>
      <DialogContent className={classes.content}>
        <AddressInput onTokenChanged={preview => setTokenPreview(preview)} />
        {error && (
          <Typography className={classes.error} color="error">{error.message}</Typography>
        )}
        <FancyButton walletRequired fullWidth
          disabled={!tokenPreview}
          className={classes.actionButton}
          variant="contained"
          color="primary"
          onClick={onCreatePool}>
          Create Pool
        </FancyButton>
      </DialogContent>
    </DialogModal>
  )
}

export default CreatePoolDialog;
