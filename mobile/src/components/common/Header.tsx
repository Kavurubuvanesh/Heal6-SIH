import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Heal6Logo } from './Heal6Logo';
import { Colors } from '../../constants/colors';

export const Header = ({ title }: { title?: string }) => <View style={styles.container}><Heal6Logo compact/>{title ? <Text style={styles.title}>{title}</Text> : null}</View>;
const styles=StyleSheet.create({container:{height:54,flexDirection:'row',alignItems:'center',paddingHorizontal:16,backgroundColor:Colors.white,borderBottomWidth:1,borderBottomColor:Colors.border},title:{fontSize:16,fontWeight:'800',color:Colors.textPrimary,marginLeft:10}});
