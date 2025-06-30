import { StyleSheet } from 'react-native';
import { BUTTON_STYLE, FONT_SIZES } from './layout';

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
    },
    logoImage: {
      width: 100,
      height: 100,
      resizeMode: 'contain',
      marginBottom: 20,
    },
    logoText: {
      fontSize: FONT_SIZES.XL + 6,
      fontWeight: '800',
      color: theme.accent,
      marginBottom: 12,
      textAlign: 'center',
    },
    input: {
      width: '100%',
      borderColor: theme.accent,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: FONT_SIZES.MD,
      marginBottom: 16,
      backgroundColor: theme.card,
    },
  googleBtn: {
    backgroundColor: '#4285F4',
    paddingVertical: BUTTON_STYLE.paddingVertical,
    paddingHorizontal: BUTTON_STYLE.paddingHorizontal,
    borderRadius: BUTTON_STYLE.borderRadius,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4
  },
    emailBtn: {
      backgroundColor: theme.accent,
      paddingVertical: BUTTON_STYLE.paddingVertical,
      paddingHorizontal: BUTTON_STYLE.paddingHorizontal,
      borderRadius: BUTTON_STYLE.borderRadius,
      width: '100%',
      alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4
  },
    btnText: {
      color: '#fff',
      fontSize: FONT_SIZES.MD,
      fontWeight: '600',
    },
  backLink: {
    color: theme.textSecondary,
    fontSize: FONT_SIZES.SM,
    marginTop: 20,
    textDecorationLine: 'underline'
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16
  },
    genderButton: {
      flex: 1,
      marginHorizontal: 4,
      paddingVertical: BUTTON_STYLE.paddingVertical,
      paddingHorizontal: BUTTON_STYLE.paddingHorizontal,
      borderWidth: 1,
      borderColor: theme.textSecondary,
      borderRadius: BUTTON_STYLE.borderRadius,
      alignItems: 'center',
      backgroundColor: theme.card,
    },
    genderSelected: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    genderText: {
      fontSize: FONT_SIZES.MD,
      color: theme.text,
    },
  genderTextSelected: {
    color: '#fff'
  },
  uploadBtn: {
    marginBottom: 20
  },
  uploadText: {
    fontSize: FONT_SIZES.MD,
    color: theme.textSecondary,
    textDecorationLine: 'underline'
  },
  navBtn: {
    backgroundColor: theme.text,
    paddingVertical: BUTTON_STYLE.paddingVertical,
    paddingHorizontal: BUTTON_STYLE.paddingHorizontal,
    borderRadius: BUTTON_STYLE.borderRadius,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4
  },
  navBtnText: {
    color: '#fff',
    fontSize: FONT_SIZES.MD,
    fontWeight: '600'
  },
    card: {
      backgroundColor: theme.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
    width: 320
  },
  cardImage: {
    width: 280,
    height: 280,
    borderRadius: 15,
    marginBottom: 10
  },
  cardName: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: theme.text,
  },
  cardBio: {
    fontSize: FONT_SIZES.MD,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center'
  },
    matchCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      padding: 16,
      marginVertical: 8,
      borderRadius: 12,
      width: '100%',
    },
  matchAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16
  },
    gameCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      width: '100%',
    },
  gameIcon: {
    fontSize: 28,
    marginRight: 16
  },
  gameTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600'
  },
    notificationBox: {
      backgroundColor: theme.card,
      padding: 14,
      marginVertical: 6,
      borderRadius: 10,
      width: '100%',
    },
    notificationText: {
      fontSize: FONT_SIZES.MD,
      color: theme.accent,
    },
    settingText: {
      fontSize: FONT_SIZES.MD,
      color: theme.textSecondary,
      marginBottom: 6,
    },
  swipeScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40
  },
  swipeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: 50
  },
  circleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5
  },
  buttonIcon: {
    fontSize: 28,
    color: '#fff'
  }
  });

export default getStyles;
